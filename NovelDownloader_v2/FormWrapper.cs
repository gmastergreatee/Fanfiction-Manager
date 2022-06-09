﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NovelDownloader_v2
{
    public class FormWrapper : Form
    {
        public new void Show()
        {
            if (IsHandleCreated)
            {
                Invoke(new Action(() =>
                {
                    base.Show();
                }));
            }
            else
                base.Show();

            FormClosing += FormWrapper_FormClosing;
        }

        private void FormWrapper_FormClosing(object sender, FormClosingEventArgs e)
        {
            Invoke(new Action(() =>
            {
                e.Cancel = true;
                Hide();
            }));
            Globals.OnLogVerbose?.Invoke(sender, ((Form)sender).Text + " window closed");
        }
    }
}
