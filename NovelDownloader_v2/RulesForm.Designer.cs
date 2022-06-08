namespace NovelDownloader_v2
{
    partial class RulesForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.listRules = new System.Windows.Forms.ListView();
            this.SuspendLayout();
            // 
            // listRules
            // 
            this.listRules.Dock = System.Windows.Forms.DockStyle.Fill;
            this.listRules.FullRowSelect = true;
            this.listRules.GridLines = true;
            this.listRules.HeaderStyle = System.Windows.Forms.ColumnHeaderStyle.Nonclickable;
            this.listRules.Location = new System.Drawing.Point(0, 0);
            this.listRules.MultiSelect = false;
            this.listRules.Name = "listRules";
            this.listRules.Size = new System.Drawing.Size(961, 499);
            this.listRules.TabIndex = 0;
            this.listRules.UseCompatibleStateImageBehavior = false;
            this.listRules.View = System.Windows.Forms.View.Details;
            // 
            // RulesForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(961, 499);
            this.Controls.Add(this.listRules);
            this.Name = "RulesForm";
            this.Text = "Rules";
            this.Load += new System.EventHandler(this.RulesForm_Load);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.ListView listRules;
    }
}